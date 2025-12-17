-- Modified query to return product_quantities and sku_quantities as JSON arrays
SELECT 
    og.id AS groupid,
    og.createdon AS orderdate,
    c.name AS customername,
    c.mobilenumber,
    SUM(o.quantity) AS totalquantity,
    og.netprice AS totalamount,
    COUNT(DISTINCT o.id) AS totalorders,
    -- Return product_quantities as JSON array
    COALESCE(
        json_agg(
            DISTINCT jsonb_build_object(
                'productname', p.name,
                'quantity', o.quantity,
                'display', p.name || ' (' || o.quantity || ' qty)'
            )
        ) FILTER (WHERE p.name IS NOT NULL),
        '[]'::json
    ) AS product_quantities,
    -- Return sku_quantities as JSON array with parsed details
    COALESCE(
        json_agg(
            DISTINCT jsonb_build_object(
                'designcode', design.designcode,
                'colour', COALESCE(
                    (SELECT skudesignattributevalue_inner.name 
                     FROM skudesignattributevaluemap 
                     INNER JOIN designattribute skudesignattribute_inner ON skudesignattribute_inner.id = skudesignattributevaluemap.designattributeid
                     INNER JOIN designattributevalue skudesignattributevalue_inner ON skudesignattributevalue_inner.id = skudesignattributevaluemap.designattributevalueid
                     WHERE skudesignattributevaluemap.skuid = sku.id 
                     AND skudesignattributevaluemap.isactive = true
                     AND skudesignattribute_inner.name ILIKE '%colour%'
                     LIMIT 1),
                    NULL
                ),
                'size', COALESCE(
                    (SELECT skudesignattributevalue_inner.name 
                     FROM skudesignattributevaluemap 
                     INNER JOIN designattribute skudesignattribute_inner ON skudesignattribute_inner.id = skudesignattributevaluemap.designattributeid
                     INNER JOIN designattributevalue skudesignattributevalue_inner ON skudesignattributevalue_inner.id = skudesignattributevaluemap.designattributevalueid
                     WHERE skudesignattributevaluemap.skuid = sku.id 
                     AND skudesignattributevaluemap.isactive = true
                     AND skudesignattribute_inner.name ILIKE '%size%'
                     LIMIT 1),
                    NULL
                ),
                'quantity', o.quantity,
                'display', COALESCE(
                    design.designcode || ' - ' || 
                    CASE 
                        WHEN EXISTS (
                            SELECT 1 FROM skudesignattributevaluemap 
                            WHERE skudesignattributevaluemap.skuid = sku.id 
                            AND skudesignattributevaluemap.isactive = true
                        ) THEN
                            'Colour: ' || COALESCE(
                                (SELECT skudesignattributevalue_inner.name 
                                 FROM skudesignattributevaluemap 
                                 INNER JOIN designattribute skudesignattribute_inner ON skudesignattribute_inner.id = skudesignattributevaluemap.designattributeid
                                 INNER JOIN designattributevalue skudesignattributevalue_inner ON skudesignattributevalue_inner.id = skudesignattributevaluemap.designattributevalueid
                                 WHERE skudesignattributevaluemap.skuid = sku.id 
                                 AND skudesignattributevaluemap.isactive = true
                                 AND skudesignattribute_inner.name ILIKE '%colour%'
                                 LIMIT 1),
                                ''
                            ) || 
                            CASE 
                                WHEN EXISTS (
                                    SELECT 1 FROM skudesignattributevaluemap 
                                    WHERE skudesignattributevaluemap.skuid = sku.id 
                                    AND skudesignattributevaluemap.isactive = true
                                    AND EXISTS (
                                        SELECT 1 FROM designattribute 
                                        WHERE designattribute.id = skudesignattributevaluemap.designattributeid
                                        AND designattribute.name ILIKE '%size%'
                                    )
                                ) THEN ', Size: ' || COALESCE(
                                    (SELECT skudesignattributevalue_inner.name 
                                     FROM skudesignattributevaluemap 
                                     INNER JOIN designattribute skudesignattribute_inner ON skudesignattribute_inner.id = skudesignattributevaluemap.designattributeid
                                     INNER JOIN designattributevalue skudesignattributevalue_inner ON skudesignattributevalue_inner.id = skudesignattributevaluemap.designattributevalueid
                                     WHERE skudesignattributevaluemap.skuid = sku.id 
                                     AND skudesignattributevaluemap.isactive = true
                                     AND skudesignattribute_inner.name ILIKE '%size%'
                                     LIMIT 1),
                                    ''
                                )
                                ELSE ''
                            END
                        ELSE ''
                    END || ' (' || o.quantity || ' qty)',
                    design.designcode || ' (' || o.quantity || ' qty)'
                )
            )
        ) FILTER (WHERE design.designcode IS NOT NULL),
        '[]'::json
    ) AS sku_quantities,
    COUNT(DISTINCT osg.id) AS total_shipments,
    STRING_AGG(DISTINCT osg.status::text, ', ') AS shipment_statuses,
    STRING_AGG(DISTINCT osg.id::text, ', ') AS shipmentgroupids
FROM ordergroup og
INNER JOIN orders o ON o.groupid = og.id
INNER JOIN users c ON c.id = og.customerid
INNER JOIN sku ON sku.id = o.skuid
INNER JOIN design ON design.id = sku.designid
INNER JOIN product p ON p.id = design.productid
LEFT JOIN ordershipment os ON os.orderid = o.id
LEFT JOIN ordershipmentgroup osg ON osg.id = os.groupid
GROUP BY og.id, og.createdon, c.name, c.mobilenumber, og.netprice
ORDER BY og.createdon DESC;

-- Alternative simpler version using subquery for cleaner JSON structure
SELECT 
    og.id AS groupid,
    og.createdon AS orderdate,
    c.name AS customername,
    c.mobilenumber,
    SUM(o.quantity) AS totalquantity,
    og.netprice AS totalamount,
    COUNT(DISTINCT o.id) AS totalorders,
    -- Product quantities as JSON array
    (
        SELECT json_agg(
            jsonb_build_object(
                'productname', p2.name,
                'quantity', o2.quantity,
                'display', p2.name || ' (' || o2.quantity || ' qty)'
            )
        )
        FROM orders o2
        INNER JOIN sku sku2 ON sku2.id = o2.skuid
        INNER JOIN design design2 ON design2.id = sku2.designid
        INNER JOIN product p2 ON p2.id = design2.productid
        WHERE o2.groupid = og.id
    ) AS product_quantities,
    -- SKU quantities as JSON array with parsed attributes
    (
        SELECT json_agg(
            jsonb_build_object(
                'designcode', design3.designcode,
                'colour', (
                    SELECT dav.name 
                    FROM skudesignattributevaluemap sdavm
                    INNER JOIN designattribute da ON da.id = sdavm.designattributeid
                    INNER JOIN designattributevalue dav ON dav.id = sdavm.designattributevalueid
                    WHERE sdavm.skuid = sku3.id 
                    AND sdavm.isactive = true
                    AND da.name ILIKE '%colour%'
                    LIMIT 1
                ),
                'size', (
                    SELECT dav.name 
                    FROM skudesignattributevaluemap sdavm
                    INNER JOIN designattribute da ON da.id = sdavm.designattributeid
                    INNER JOIN designattributevalue dav ON dav.id = sdavm.designattributevalueid
                    WHERE sdavm.skuid = sku3.id 
                    AND sdavm.isactive = true
                    AND da.name ILIKE '%size%'
                    LIMIT 1
                ),
                'quantity', o3.quantity,
                'display', 
                    design3.designcode || 
                    CASE 
                        WHEN EXISTS (
                            SELECT 1 FROM skudesignattributevaluemap 
                            WHERE skudesignattributevaluemap.skuid = sku3.id 
                            AND skudesignattributevaluemap.isactive = true
                        ) THEN
                            ' - Colour: ' || COALESCE(
                                (SELECT dav.name 
                                 FROM skudesignattributevaluemap sdavm
                                 INNER JOIN designattribute da ON da.id = sdavm.designattributeid
                                 INNER JOIN designattributevalue dav ON dav.id = sdavm.designattributevalueid
                                 WHERE sdavm.skuid = sku3.id 
                                 AND sdavm.isactive = true
                                 AND da.name ILIKE '%colour%'
                                 LIMIT 1),
                                ''
                            ) || 
                            CASE 
                                WHEN EXISTS (
                                    SELECT 1 FROM skudesignattributevaluemap sdavm
                                    INNER JOIN designattribute da ON da.id = sdavm.designattributeid
                                    WHERE sdavm.skuid = sku3.id 
                                    AND sdavm.isactive = true
                                    AND da.name ILIKE '%size%'
                                ) THEN ', Size: ' || COALESCE(
                                    (SELECT dav.name 
                                     FROM skudesignattributevaluemap sdavm
                                     INNER JOIN designattribute da ON da.id = sdavm.designattributeid
                                     INNER JOIN designattributevalue dav ON dav.id = sdavm.designattributevalueid
                                     WHERE sdavm.skuid = sku3.id 
                                     AND sdavm.isactive = true
                                     AND da.name ILIKE '%size%'
                                     LIMIT 1),
                                    ''
                                )
                                ELSE ''
                            END
                        ELSE ''
                    END || ' (' || o3.quantity || ' qty)'
            )
        )
        FROM orders o3
        INNER JOIN sku sku3 ON sku3.id = o3.skuid
        INNER JOIN design design3 ON design3.id = sku3.designid
        WHERE o3.groupid = og.id
    ) AS sku_quantities,
    COUNT(DISTINCT osg.id) AS total_shipments,
    STRING_AGG(DISTINCT osg.status::text, ', ') AS shipment_statuses,
    STRING_AGG(DISTINCT osg.id::text, ', ') AS shipmentgroupids
FROM ordergroup og
INNER JOIN users c ON c.id = og.customerid
LEFT JOIN ordershipment os ON os.orderid IN (SELECT id FROM orders WHERE groupid = og.id)
LEFT JOIN ordershipmentgroup osg ON osg.id = os.groupid
GROUP BY og.id, og.createdon, c.name, c.mobilenumber, og.netprice
ORDER BY og.createdon DESC;


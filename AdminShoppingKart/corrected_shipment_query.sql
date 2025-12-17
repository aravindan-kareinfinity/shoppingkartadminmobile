-- Corrected query with proper handling
SELECT 
    og.id AS groupid,
    og.createdon AS orderdate,
    c.name AS customername,
    c.mobilenumber,
    SUM(o.quantity) AS totalquantity,
    og.netprice AS totalamount,
    -- Shipment group info
    osg.id AS shipmentgroupid,
    osg.status AS shipmentgroupstatus,
    -- Additional aggregated info
    COUNT(DISTINCT o.id) AS totalorders,
    STRING_AGG(DISTINCT COALESCE(o.productname, 'N/A') || ' (' || o.quantity || ' qty)', ', ' ORDER BY o.id) AS product_quantities,
    STRING_AGG(DISTINCT o.skuid::text || ' (' || o.quantity || ' qty)', ', ' ORDER BY o.id) AS sku_quantities,
    -- Extract from attributes JSON
    osg.attributes->'history'->'HistoryStatus' AS historystatusarray,
    osg.attributes->>'shiprocketorderid' AS shiprocketorderid,
    osg.attributes->'shiprocketcreateorderres'->>'awb_code' AS awb_code,
    osg.attributes->'shiprocketcreateorderres'->>'courier_name' AS courier_name
FROM ordergroup og
INNER JOIN orders o ON o.groupid = og.id
INNER JOIN users c ON c.id = og.customerid
LEFT JOIN ordershipment os ON os.orderid = o.id
LEFT JOIN ordershipmentgroup osg ON osg.id = os.groupid
GROUP BY 
    og.id, 
    og.createdon, 
    c.name,
    c.mobilenumber,
    og.netprice,
    osg.id,
    osg.status,
    osg.attributes
ORDER BY og.createdon DESC;

-- Enhanced query with ordershipmentgroup details and history status
SELECT 
    -- Order Group Info
    og.id AS groupid,
    og.createdon AS orderdate,
    c.name AS customername,
    c.mobilenumber,
    SUM(o.quantity) AS totalquantity,
    og.netprice AS totalamount,
    COUNT(o.id) AS totalorders,
    STRING_AGG(o.skuid::text || ' (' || o.quantity || ' qty)', ', ') AS sku_quantities,
    
    -- Shipment Group Info (all columns from ordershipmentgroup)
    osg.id AS shipmentgroupid,
    osg.status AS shipmentgroupstatus,
    osg.createdon AS shipmentcreatedon,
    osg.modifiedon AS shipmentmodifiedon,
    osg.ordergroupid,
    osg.partner AS shipmentpartner,
    osg.custompartnername,
    osg.shiprocketorderid,
    osg.shiprocketreturnorderid,
    osg.shiprocketpickuplocationname,
    osg.shiprocketpickuplocationpincode,
    osg.shiprocketpickupscheduleddate,
    osg.attributes AS shipmentattributes,
    
    -- Extract history status array from JSON attributes
    osg.attributes->'history'->'HistoryStatus' AS historystatusarray,
    
    -- Extract specific fields from attributes JSON
    osg.attributes->>'shiprocketorderid' AS attr_shiprocketorderid,
    osg.attributes->'packagedetails'->>'length' AS package_length,
    osg.attributes->'packagedetails'->>'breadth' AS package_breadth,
    osg.attributes->'packagedetails'->>'height' AS package_height,
    osg.attributes->'packagedetails'->>'weight' AS package_weight,
    osg.attributes->'deliverydetails'->>'name' AS delivery_name,
    osg.attributes->'deliverydetails'->>'mobile' AS delivery_mobile,
    osg.attributes->'deliverydetails'->>'pincode' AS delivery_pincode,
    osg.attributes->'pickupdetails'->>'pincode' AS pickup_pincode,
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
    osg.createdon,
    osg.modifiedon,
    osg.ordergroupid,
    osg.partner,
    osg.custompartnername,
    osg.shiprocketorderid,
    osg.shiprocketreturnorderid,
    osg.shiprocketpickuplocationname,
    osg.shiprocketpickuplocationpincode,
    osg.shiprocketpickupscheduleddate,
    osg.attributes
ORDER BY og.createdon DESC;

-- Alternative query: Unnest history status to show each status entry as a separate row
SELECT 
    -- Order Group Info
    og.id AS groupid,
    og.createdon AS orderdate,
    c.name AS customername,
    c.mobilenumber,
    SUM(o.quantity) AS totalquantity,
    og.netprice AS totalamount,
    COUNT(o.id) AS totalorders,
    
    -- Shipment Group Info
    osg.id AS shipmentgroupid,
    osg.status AS shipmentgroupstatus,
    osg.attributes AS shipmentattributes,
    
    -- History Status Details (unnested - one row per status entry)
    history_entry->>'status' AS history_status,
    history_entry->>'statusname' AS history_statusname,
    history_entry->>'modifiedon' AS history_modifiedon,
    history_entry->>'notes' AS history_notes,
    history_entry->>'modifiedby' AS history_modifiedby,
    history_entry->>'modifiedbyname' AS history_modifiedbyname,
    ROW_NUMBER() OVER (PARTITION BY osg.id ORDER BY (history_entry->>'modifiedon')::timestamp DESC) AS history_sequence
    
FROM ordergroup og
INNER JOIN orders o ON o.groupid = og.id
INNER JOIN users c ON c.id = og.customerid
LEFT JOIN ordershipment os ON os.orderid = o.id
LEFT JOIN ordershipmentgroup osg ON osg.id = os.groupid
LEFT JOIN LATERAL jsonb_array_elements(osg.attributes->'history'->'HistoryStatus') AS history_entry ON true
GROUP BY 
    og.id, 
    og.createdon, 
    c.name,
    c.mobilenumber,
    og.netprice,
    osg.id,
    osg.status,
    osg.attributes,
    history_entry
ORDER BY og.createdon DESC, history_sequence;

-- Query to get latest history status only (most recent status per shipment)
SELECT 
    og.id AS groupid,
    og.createdon AS orderdate,
    c.name AS customername,
    c.mobilenumber,
    SUM(o.quantity) AS totalquantity,
    og.netprice AS totalamount,
    COUNT(o.id) AS totalorders,
    osg.id AS shipmentgroupid,
    osg.status AS shipmentgroupstatus,
    osg.attributes AS shipmentattributes,
    
    -- Latest history status (most recent)
    (
        SELECT jsonb_array_elements(osg.attributes->'history'->'HistoryStatus')
        ORDER BY (jsonb_array_elements(osg.attributes->'history'->'HistoryStatus')->>'modifiedon')::timestamp DESC
        LIMIT 1
    ) AS latest_history_status,
    
    -- Latest status details
    (
        SELECT jsonb_array_elements(osg.attributes->'history'->'HistoryStatus')->>'statusname'
        ORDER BY (jsonb_array_elements(osg.attributes->'history'->'HistoryStatus')->>'modifiedon')::timestamp DESC
        LIMIT 1
    ) AS latest_statusname,
    
    (
        SELECT jsonb_array_elements(osg.attributes->'history'->'HistoryStatus')->>'modifiedon'
        ORDER BY (jsonb_array_elements(osg.attributes->'history'->'HistoryStatus')->>'modifiedon')::timestamp DESC
        LIMIT 1
    ) AS latest_status_date
    
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


using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Common;
using System.Text.Json;
using System.Threading.Tasks;

// JSON Models for Product and SKU Quantities
public class ProductQuantityJson
{
    public string productname { get; set; }
    public int quantity { get; set; }
    public string display { get; set; }
}

public class SkuQuantityJson
{
    public string designcode { get; set; }
    public string colour { get; set; }
    public string size { get; set; }
    public int quantity { get; set; }
    public string display { get; set; }
}

// Modified method to return JSON format
private async Task<List<OrderGroupGetWithDetailsRes>> GetWithDetailsGroupTransaction(IDb db, OrderGetWithDetailsReq req)
{
    var result = new List<OrderGroupGetWithDetailsRes>();
    string query = @"
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
    LEFT JOIN ordershipmentgroup osg ON osg.id = os.groupid";

    var queryBuilder = _queryBuilderProvider.GetQueryBuilder(query);
    var currentUser = _requestState.usercontext;

    if (req.getall == false)
    {
        queryBuilder.AddParameter("not (o.status = ANY (@status))", "status", new int[] {
            (int)OrderStatuses.Closed,
            (int)OrderStatuses.PaymentPending,
            (int)OrderStatuses.PaymentFailed,
            (int)OrderStatuses.Cancelled
        }, DbTypes.Types.Unknown);
    }

    if (req.vendorid > 0)
    {
        queryBuilder.AddParameter("o.vendorid", "=", "vendorid", req.vendorid, DbTypes.Types.Long);
    }

    queryBuilder.AddGroupBy("og.id, og.createdon, c.name, c.mobilenumber, og.netprice");
    queryBuilder.AddOrderBy(QueryBuilder.Order.DESC, "og.createdon");
    var command = queryBuilder.GetCommand(db);

    using (DbDataReader reader = await db.Execute(command))
    {
        while (await reader.ReadAsync())
        {
            var item = new OrderGroupGetWithDetailsRes();
            item.groupid = reader["groupid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["groupid"]);
            item.orderdate = reader["orderdate"] == DBNull.Value ? Base.GetMinimumDate() : Convert.ToDateTime(reader["orderdate"]);
            item.customername = reader["customername"] == DBNull.Value ? "" : reader["customername"].ToString();
            item.mobilenumber = reader["mobilenumber"] == DBNull.Value ? "" : reader["mobilenumber"].ToString();
            item.totalquantity = reader["totalquantity"] == DBNull.Value ? 0 : Convert.ToInt32(reader["totalquantity"]);
            item.totalamount = reader["totalamount"] == DBNull.Value ? 0 : Convert.ToDecimal(reader["totalamount"]);
            item.totalorders = reader["totalorders"] == DBNull.Value ? 0 : Convert.ToInt32(reader["totalorders"]);
            
            // Parse JSON for product_quantities
            if (reader["product_quantities"] != DBNull.Value)
            {
                string productJson = reader["product_quantities"].ToString();
                try
                {
                    var products = JsonSerializer.Deserialize<List<ProductQuantityJson>>(productJson);
                    // Convert to display string format for backward compatibility
                    item.product_quantities = string.Join(", ", products.Select(p => p.display));
                }
                catch
                {
                    item.product_quantities = productJson; // Fallback to raw JSON string
                }
            }
            else
            {
                item.product_quantities = "";
            }
            
            // Parse JSON for sku_quantities
            if (reader["sku_quantities"] != DBNull.Value)
            {
                string skuJson = reader["sku_quantities"].ToString();
                try
                {
                    var skus = JsonSerializer.Deserialize<List<SkuQuantityJson>>(skuJson);
                    // Convert to display string format for backward compatibility
                    item.sku_quantities = string.Join(", ", skus.Select(s => s.display));
                }
                catch
                {
                    item.sku_quantities = skuJson; // Fallback to raw JSON string
                }
            }
            else
            {
                item.sku_quantities = "";
            }
            
            item.total_shipments = reader["total_shipments"] == DBNull.Value ? 0 : Convert.ToInt32(reader["total_shipments"]);
            item.shipment_statuses = reader["shipment_statuses"] == DBNull.Value ? "" : reader["shipment_statuses"].ToString();
            item.shipmentgroupids = reader["shipmentgroupids"] == DBNull.Value ? "" : reader["shipmentgroupids"].ToString();
            
            result.Add(item);
        }
    }

    return result;
}

// Example JSON output format:
/*
{
  "groupid": 123,
  "orderdate": "2025-12-15T10:30:00",
  "customername": "John Doe",
  "mobilenumber": "9876543210",
  "totalquantity": 2,
  "totalamount": 7798.00,
  "totalorders": 2,
  "product_quantities": [
    {
      "productname": "Product Name",
      "quantity": 1,
      "display": "Product Name (1 qty)"
    }
  ],
  "sku_quantities": [
    {
      "designcode": "0076",
      "colour": "NAVY",
      "size": "XL",
      "quantity": 1,
      "display": "0076 - Colour: NAVY, Size: XL (1 qty)"
    },
    {
      "designcode": "2977-GREY",
      "colour": "GREY",
      "size": "M",
      "quantity": 1,
      "display": "2977-GREY - Colour: GREY, Size: M (1 qty)"
    }
  ],
  "total_shipments": 1,
  "shipment_statuses": "190",
  "shipmentgroupids": "456"
}
*/


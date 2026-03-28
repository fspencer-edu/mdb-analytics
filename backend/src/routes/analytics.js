import express from "express";
import pool from "../db.js";

const router = express.Router();

router.get("/cities", async (req, res) => {
  let conn;

  try {
    conn = await pool.getConnection();
    const rows = await conn.query(`
      SELECT city_name, province
      FROM cities
      ORDER BY city_name
    `);
    res.json(rows);
  } catch (err) {
    console.error("GET /cities error:", err);
    res.status(500).json({ error: "Failed to fetch cities" });
  } finally {
    if (conn) conn.release();
  }
});

router.get("/rent-trends", async (req, res) => {
  let conn;

  try {
    conn = await pool.getConnection();

    const city = req.query.city;
    let rows;

    if (city) {
      rows = await conn.query(
        `
        SELECT
          c.city_name,
          c.province,
          mr.year,
          mr.month,
          mr.avg_rent
        FROM monthly_rent mr
        JOIN cities c ON c.city_id = mr.city_id
        WHERE c.city_name = ?
        ORDER BY mr.year, mr.month
        `,
        [city]
      );
    } else {
      rows = await conn.query(`
        SELECT
          c.city_name,
          c.province,
          mr.year,
          mr.month,
          mr.avg_rent
        FROM monthly_rent mr
        JOIN cities c ON c.city_id = mr.city_id
        ORDER BY c.city_name, mr.year, mr.month
      `);
    }

    res.json(rows);
  } catch (err) {
    console.error("GET /rent-trends error:", err);
    res.status(500).json({ error: "Failed to fetch rent trends" });
  } finally {
    if (conn) conn.release();
  }
});

router.get("/summary", async (req, res) => {
  let conn;

  try {
    conn = await pool.getConnection();
    const rows = await conn.query(`
      SELECT
        c.city_name,
        c.province,
        ROUND(AVG(mr.avg_rent), 2) AS average_rent,
        MIN(mr.avg_rent) AS min_rent,
        MAX(mr.avg_rent) AS max_rent
      FROM monthly_rent mr
      JOIN cities c ON c.city_id = mr.city_id
      GROUP BY c.city_name, c.province
      ORDER BY average_rent DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error("GET /summary error:", err);
    res.status(500).json({ error: "Failed to fetch summary" });
  } finally {
    if (conn) conn.release();
  }
});

export default router;
# MariaDB ETL

- Previous data
- ETL/cleaning
- MariaDB
- Backend API
- Analytics dashboard

ETL
- python
- pandas

DB
- MariaDB

API
- Node.js
- Express

Dashboard/UI
- React

Charts
- Recharts


## Create Database

```bash
docker exec -i analytics-mariadb mariadb -uanalytics_user -panalytics_pass analytics_db < backend/src/sql/schema.sql

python etl/load_data.py
```
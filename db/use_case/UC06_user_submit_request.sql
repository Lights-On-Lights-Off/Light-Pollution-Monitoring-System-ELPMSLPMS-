INSERT INTO data_requests
  (request_code, user_id, user_name, building_id, location, data_type, purpose,
   additional_notes, start_date, end_date, status)
VALUES
  (
    CONCAT('REQ-', UNIX_TIMESTAMP(), '-', FLOOR(RAND() * 1000)),
    1,
    (SELECT name FROM users WHERE id = 1),
    6,
    'ICS Laboratory',
    'Light Intensity',
    'Studying the effect of artificial lighting on student concentration in the ICS lab.',
    'Hourly averages preferred. Night readings (8PM–6AM) are most important.',
    '2025-07-01',
    '2025-07-31',
    'pending'
  );

SELECT
  dr.request_code,
  dr.status,
  b.name  AS building_name,
  u.name  AS submitted_by,
  dr.submitted_at
FROM  data_requests dr
JOIN  buildings      b ON b.id = dr.building_id
JOIN  users          u ON u.id = dr.user_id
ORDER BY dr.submitted_at DESC
LIMIT 1;

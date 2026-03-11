INSERT INTO data_requests
  (request_code, user_id, user_name, building_id, location, data_type, purpose,
   additional_notes, start_date, end_date, status, reviewed_by, reviewed_at, submitted_at)
VALUES

  (
    'REQ-1001',
    1, 'Default User', 5, 'BSBA Building',
    'Light Intensity',
    'Research on light pollution effects on nighttime biodiversity near the BSBA building.',
    'Need hourly lux readings if available.',
    '2025-06-01', '2025-06-07',
    'pending', NULL, NULL,
    DATE_SUB(NOW(), INTERVAL 3 DAY)
  ),

  (
    'REQ-1002',
    1, 'Default User', 3, 'NBSC Library',
    'Pollution Level',
    'Thesis data collection on low-light campus areas for environmental science study.',
    NULL,
    '2025-05-01', '2025-05-31',
    'approved', 2, DATE_SUB(NOW(), INTERVAL 1 DAY),
    DATE_SUB(NOW(), INTERVAL 5 DAY)
  ),

  (
    'REQ-1003',
    1, 'Default User', 1, 'SWDC Building',
    'Light Intensity',
    'Personal project.',
    NULL,
    '2025-04-01', '2025-04-30',
    'denied', 2, DATE_SUB(NOW(), INTERVAL 2 DAY),
    DATE_SUB(NOW(), INTERVAL 7 DAY)
  ),

  (
    'REQ-1004',
    1, 'Default User', 6, 'ICS Laboratory',
    'Light Intensity',
    'Comparing light pollution levels between laboratory buildings and open areas.',
    'Please include min and max readings per hour.',
    '2025-06-10', '2025-06-20',
    'pending', NULL, NULL,
    DATE_SUB(NOW(), INTERVAL 1 DAY)
  );

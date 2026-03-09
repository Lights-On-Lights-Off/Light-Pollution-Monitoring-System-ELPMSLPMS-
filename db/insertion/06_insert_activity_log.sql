INSERT INTO activity_log
  (actor_id, action, target_type, target_id, meta, created_at)
VALUES

  (
    2,
    'approved',
    'request',
    2,
    '{"request_code": "REQ-1002", "building": "NBSC Library", "user": "Default User"}',
    DATE_SUB(NOW(), INTERVAL 1 DAY)
  ),

  (
    2,
    'denied',
    'request',
    3,
    '{"request_code": "REQ-1003", "building": "SWDC Building", "user": "Default User"}',
    DATE_SUB(NOW(), INTERVAL 2 DAY)
  );

INSERT INTO activity_log
  (actor_id, action, target_type, target_id, detail, meta, created_at)
VALUES

  (
    2,
    'approved_request',
    'request',
    2,
    'Approved request REQ-1002 from Default User',
    '{"request_code": "REQ-1002", "building": "NBSC Library", "user": "Default User"}',
    DATE_SUB(NOW(), INTERVAL 1 DAY)
  ),

  (
    2,
    'denied_request',
    'request',
    3,
    'Denied request REQ-1003 from Default User',
    '{"request_code": "REQ-1003", "building": "SWDC Building", "user": "Default User"}',
    DATE_SUB(NOW(), INTERVAL 2 DAY)
  );

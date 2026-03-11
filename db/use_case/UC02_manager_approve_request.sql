UPDATE data_requests
SET
  status      = 'approved',
  reviewed_by = 2,
  reviewed_at = NOW()
WHERE
  request_code = 'REQ-1001'
  AND status   = 'pending'
  AND is_deleted = 0;

INSERT INTO notifications
  (user_id, request_id, title, message, type)
VALUES
  (
    (SELECT user_id FROM data_requests WHERE request_code = 'REQ-1001'),
    (SELECT id      FROM data_requests WHERE request_code = 'REQ-1001'),
    'Request Approved',
    'Your data request (REQ-1001) for BSBA Building has been approved by the manager. You may now download the data.',
    'approved'
  );

INSERT INTO activity_log
  (actor_id, action, target_type, target_id, detail, meta)
VALUES
  (
    2,
    'approved_request',
    'request',
    (SELECT id FROM data_requests WHERE request_code = 'REQ-1001'),
    'Approved request REQ-1001 from Default User',
    '{"request_code": "REQ-1001", "building": "BSBA Building", "user": "Default User"}'
  );

SELECT
  dr.request_code,
  dr.status,
  dr.reviewed_at,
  u.name AS reviewed_by_name
FROM  data_requests dr
JOIN  users          u ON u.id = dr.reviewed_by
WHERE dr.request_code = 'REQ-1001';

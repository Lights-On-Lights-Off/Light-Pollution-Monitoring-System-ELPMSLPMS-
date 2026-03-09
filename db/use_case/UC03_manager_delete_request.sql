UPDATE data_requests
SET
  is_deleted = 1,
  deleted_at = NOW()
WHERE
  request_code = 'REQ-1003'
  AND is_deleted = 0;

INSERT INTO activity_log
  (actor_id, action, target_type, target_id, meta)
VALUES
  (
    2,
    'deleted',
    'request',
    (SELECT id FROM data_requests WHERE request_code = 'REQ-1003'),
    '{"request_code": "REQ-1003", "previous_status": "denied"}'
  );

SELECT request_code, status, is_deleted, deleted_at
FROM   data_requests
WHERE  request_code = 'REQ-1003';

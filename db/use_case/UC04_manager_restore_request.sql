UPDATE data_requests
SET
  is_deleted = 0,
  deleted_at = NULL
WHERE
  request_code = 'REQ-1003'
  AND is_deleted = 1;

INSERT INTO activity_log
  (actor_id, action, target_type, target_id, detail, meta)
VALUES
  (
    2,
    'restored',
    'request',
    (SELECT id FROM data_requests WHERE request_code = 'REQ-1003'),
    'Restored request REQ-1003',
    '{"request_code": "REQ-1003"}'
  );

SELECT request_code, status, is_deleted, deleted_at
FROM   data_requests
WHERE  request_code = 'REQ-1003';

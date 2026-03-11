INSERT INTO buildings
  (code, name, description, latitude, longitude, pollution_level, lux_baseline, is_online)
VALUES
  (
    'B07',
    'Engineering Building',
    'Mechanical and civil engineering classrooms and labs.',
    8.35880000, 124.86850000,
    'moderate',
    65.00,
    1
  );

-- NOTE: target_id = 7 assumes this runs immediately after the seed with no other building inserts.
--       In production, use LAST_INSERT_ID() instead.
INSERT INTO activity_log
  (actor_id, action, target_type, target_id, detail, meta)
VALUES
  (
    2,
    'added_building',
    'building',
    LAST_INSERT_ID(),
    'Added building "Engineering Building"',
    '{"code": "B07", "name": "Engineering Building", "pollution_level": "moderate"}'
  );

SELECT id, code, name, pollution_level, lux_baseline, is_online, created_at
FROM   buildings
WHERE  code = 'B07';

SELECT name 
FROM sys.foreign_keys
WHERE parent_object_id = OBJECT_ID('Questions');
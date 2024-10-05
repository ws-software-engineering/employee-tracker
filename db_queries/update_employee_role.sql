update
    employee
set
    role_id = $1
where
    id = $2;

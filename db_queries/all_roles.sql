select
    r.title,
    d.name as department,
    r.salary
from 
    role r
    join department d
        on r.department_id = d.id;
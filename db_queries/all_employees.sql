with manager_name as (
    select 
        e1.id,
        e1.first_name
    from
        employee e1
),
manager as (
    select 
        e2.id,
        m.first_name,
        e2.manager_id
    from
        employee e2
    join manager_name m on e2.manager_id = m.id
)
select distinct
    emp.id,
    emp.first_name,
    emp.last_name,
    r.title,
    dep.name as department,
    r.salary,
    m.first_name as manager
from
    employee emp
    join role r 
        on emp.role_id = r.id
    join department dep 
        on r.department_id = dep.id
    left join manager m 
        on emp.manager_id = m.manager_id
order by id asc;
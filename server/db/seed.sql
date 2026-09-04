INSERT INTO menu_items (name, category, price, preparation_time)
VALUES
    ('Jollof Rice', 'FOOD', 3500.00, 20),
    ('Fried Rice', 'FOOD', 4000.00, 20),
    ('Grilled Chicken', 'FOOD', 5000.00, 25),
    ('Beef Steak', 'FOOD', 6500.00, 30),
    ('Chicken Wings', 'FOOD', 4500.00, 20),
    ('Coke', 'DRINK', 1000.00, 2),
    ('Fanta', 'DRINK', 1000.00, 2),
    ('Chapman', 'DRINK', 2500.00, 5),
    ('Bottled Water', 'DRINK', 500.00, 1),
    ('Fresh Orange Juice', 'DRINK', 2000.00, 5)
ON CONFLICT (name) DO NOTHING;


INSERT INTO staff (name, role)
VALUES
    ('David', 'WAITER'),
    ('Sarah', 'WAITER'),
    ('John', 'CHEF'),
    ('Michael', 'CHEF'),
    ('Grace', 'BARTENDER'),
    ('Peter', 'BARTENDER')
ON CONFLICT (name, role) DO NOTHING;
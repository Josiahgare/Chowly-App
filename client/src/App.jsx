import { useEffect, useState } from "react";

function App() {
    const [menu, setMenu] = useState([]);
    const [mode, setMode] = useState("customer");

    useEffect(() => {
        fetch("http://localhost:3001/api/menu")
            .then(response => response.json())
            .then(data => setMenu(data))
            .catch(error => console.error(error));
    }, []);

    return (
        <div>
            <header>
                <h1>CHOWLY</h1>

                <button onClick={() => setMode("customer")}>
                    Customer
                </button>

                <button onClick={() => setMode("waiter")}>
                    Waiter
                </button>
            </header>

            {mode === "customer" ? (
                <main>
                    <h2>Menu</h2>

                    {menu.map(item => (
                        <div key={item.id}>
                            <h3>{item.name}</h3>

                            <p>
                                ₦{Number(item.price).toLocaleString()}
                            </p>

                            <p>
                                Preparation: {item.preparation_time} minutes
                            </p>

                            <button>Add to Order</button>
                        </div>
                    ))}
                </main>
            ) : (
                <main>
                    <h2>Waiter Dashboard</h2>
                    <p>Orders will appear here.</p>
                </main>
            )}
        </div>
    );
}

export default App;
import React, { useState, useEffect } from "react";
import "./App.css";
import { db } from "./firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

function App() {
  const [data, setData] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [editingBudget, setEditingBudget] = useState(false);

  // Use "Sep2025" format for month-year keys
  const date = new Date();
  const currentMonthYear = date
    .toLocaleString("default", { month: "short", year: "numeric" })
    .replace(" ", "");

  // Firestore reference
  const budgetDocRef = doc(db, "budgetData", "main");

  // Load data once
  useEffect(() => {
    const fetchData = async () => {
      try {
        const docSnap = await getDoc(budgetDocRef);
        if (docSnap.exists()) {
          setData(docSnap.data());
        } else {
          const initial = {
            [currentMonthYear]: { budget: 2000, expenses: [] },
          };
          await setDoc(budgetDocRef, initial);
          setData(initial);
        }
      } catch (err) {
        console.error("Error loading Firestore:", err.message);
        setData({
          [currentMonthYear]: { budget: 2000, expenses: [] },
        });
      }
    };
    fetchData();
  }, [currentMonthYear]);

  // Save to Firestore
  const saveData = async (newData) => {
    setData(newData);
    await setDoc(budgetDocRef, newData);
  };

  // Add new expense
  const addExpense = (e) => {
    e.preventDefault();
    const title = e.target.title.value;
    const note = e.target.note.value;
    const amount = parseFloat(e.target.amount.value);
    const category = e.target.category.value;

    if (!title || isNaN(amount) || !category) return;

    const newExpense = {
      id: Date.now(),
      title,
      note,
      amount,
      category,
    };

    const updated = {
      ...data,
      [currentMonthYear]: {
        ...data[currentMonthYear],
        expenses: [...(data[currentMonthYear]?.expenses || []), newExpense],
      },
    };

    saveData(updated);
    setShowForm(false);
    e.target.reset();
  };

  // Delete expense
  const deleteExpense = (id) => {
    const updated = {
      ...data,
      [currentMonthYear]: {
        ...data[currentMonthYear],
        expenses: data[currentMonthYear].expenses.filter((e) => e.id !== id),
      },
    };
    saveData(updated);
  };

  // Update budget
  const updateBudget = (e) => {
    e.preventDefault();
    const newBudget = parseFloat(e.target.budget.value);
    if (isNaN(newBudget) || newBudget <= 0) return;

    const updated = {
      ...data,
      [currentMonthYear]: {
        ...data[currentMonthYear],
        budget: newBudget,
        expenses: data[currentMonthYear].expenses,
      },
    };
    saveData(updated);
    setEditingBudget(false);
  };

  if (!data[currentMonthYear]) return null;
  const monthData = data[currentMonthYear];
  const spent = monthData.expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="budget-info">
          <div className="spent">${(monthData.budget - spent).toFixed(2)}</div>
          <div className="total">
            of{" "}
            {editingBudget ? (
              <form className="inline-budget-form" onSubmit={updateBudget}>
                <input
                  type="number"
                  step="0.01"
                  name="budget"
                  defaultValue={monthData.budget}
                  autoFocus
                />
                <button type="submit">✔</button>
              </form>
            ) : (
              <>
                ${monthData.budget.toFixed(2)} budget{" "}
                <button
                  className="edit-btn"
                  onClick={() => setEditingBudget(true)}
                >
                  ✎
                </button>
              </>
            )}
          </div>
        </div>
        <div className="month">{currentMonthYear}</div>
        <div className="actions">
          <button onClick={() => setShowForm(!showForm)}>＋</button>
          <button title="History" onClick={() => setShowHistory(true)}>🕘</button>
        </div>
      </header>

      {/* Add Expense Form */}
      {showForm && (
        <form className="expense-form-inline" onSubmit={addExpense}>
          <input name="title" placeholder="Title" required />
          <input name="note" placeholder="Note" />
          <input
            name="amount"
            type="number"
            step="0.01"
            placeholder="Amount"
            required
          />
          <select name="category" required>
            <option value="">Category</option>
            <option value="Food">Food</option>
            <option value="Sports">Sports</option>
            <option value="Groceries">Groceries</option>
            <option value="Transportation">Transportation</option>
            <option value="Miscellaneous">Miscellaneous</option>
          </select>
          <button type="submit">Add</button>
        </form>
      )}

      {/* Expenses List */}
      {!showForm && (
        <div className="expenses">
          {monthData.expenses.length === 0 ? (
            <p className="empty">No expenses yet</p>
          ) : (
            monthData.expenses.map((exp) => (
              <div key={exp.id} className="expense">
                <div>
                  <div className="expense-title">{exp.title}</div>
                  <div className="expense-note">{exp.note}</div>
                  <div className="expense-category">{exp.category}</div>
                </div>
                <div className="expense-right">
                  <div className="expense-amount">-${exp.amount.toFixed(2)}</div>
                  <button
                    className="delete-btn"
                    onClick={() => deleteExpense(exp.id)}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>History</h2>
            {Object.keys(data)
              .sort((a, b) => new Date(b) - new Date(a)) // newest first
              .map((month) => {
                const monthExpenses = data[month].expenses;
                const monthSpent = monthExpenses.reduce(
                  (sum, e) => sum + e.amount,
                  0
                );

                // build category summary
                const categorySummary = monthExpenses.reduce((acc, e) => {
                  acc[e.category] = (acc[e.category] || 0) + e.amount;
                  return acc;
                }, {});

                return (
                  <div key={month} className="history-item">
                    <strong>{month}</strong>
                    <div>Budget: ${data[month].budget}</div>
                    <div>Spent: ${monthSpent.toFixed(2)}</div>

                    {/* Category breakdown */}
                    {Object.keys(categorySummary).map((cat) => (
                      <div key={cat} className="history-category">
                        {cat}: ${categorySummary[cat].toFixed(2)}
                      </div>
                    ))}
                  </div>
                );
              })}
            <button className="close-btn" onClick={() => setShowHistory(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

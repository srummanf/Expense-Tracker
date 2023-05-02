import './App.css';
import Header from './components/Header';
import Balance from './components/Balance';
import IncomeExpenses from './components/IncomeExpenses';
import TransactionList from './components/TransactionList';
import AddTransaction from './components/AddTransaction';
import { GlobalProvider } from './context/GlobalState';
import React, { useEffect } from 'react';

function Example() {
  useEffect(() => {
    document.title = 'My Page Title';
  }, []);
}

function App() {
  return (
    <GlobalProvider>
    <Header/>
    <div className="container">
      <Balance></Balance>
      <IncomeExpenses></IncomeExpenses>
      <TransactionList></TransactionList>
      <AddTransaction></AddTransaction>
    </div>
    </GlobalProvider>
  );
}

export default App;

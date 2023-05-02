import React,{useContext} from 'react'
import {GlobalContext} from '../context/GlobalState';

const Transaction = ({ transaction }) => {
    const sign = transaction.amount < 0 ? '-' : '+';
    const {deleteTransaction} = useContext(GlobalContext);
    return (
        < li class={transaction.amount <0 ? 'minus': 'plus'} >
            {transaction.text} <span > {sign}${Math.abs(transaction.amount)}</span><button class="delete-btn" onClick={()=>deleteTransaction(transaction.id)}>x</button>
        </li >
    )
}

export default Transaction

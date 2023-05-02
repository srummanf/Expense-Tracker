import React from 'react'

const Transaction = ({ transaction }) => {
    const sign = transaction.amount < 0 ? '-' : '+';
    return (
        < li class="minus" >
            {transaction.text} <span > {sign}${Math.abs(transaction.amount)}</span><button class="delete-btn">x</button>
        </li >
    )
}

export default Transaction

import React from 'react'

const Transaction = ({transaction}) => {
    return (
        < li class="minus" >
            {transaction.text} <span > -$400</span > <button class="delete-btn">x</button>
        </li >
    )
}

export default Transaction

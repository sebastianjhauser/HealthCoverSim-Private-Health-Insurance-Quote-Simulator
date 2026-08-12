import { useState, useEffect } from 'react'
import { Link } from 'react-router'

function QuoteList() {
const [quotes, setQuotes] = useState([])

useEffect(() => {
    fetch('/api/quotes')
    .then(res => res.json())
    .then(setQuotes)
}, [])

return (
    <div>
    <h1>Quotes</h1>
    <Link to="/new">New quote</Link>
    <ul>
        {quotes.map(q => (
        <li key={q.id}>
            <Link to={`/quotes/${q.id}`}>{q.customer_name} | {q.cover_type}</Link>
        </li>
        ))}
    </ul>
    </div>
)
}

export default QuoteList
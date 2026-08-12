import { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router'

function QuoteDetail() {
const { id } = useParams()
const navigate = useNavigate()
const [quote, setQuote] = useState(null)

// Holds an error message if the quote can't be loaded (deleted, bad id,
// API down). Kept separate from `quote` so we never try to render a
// breakdown from a response that isn't actually a quote.
const [error, setError] = useState(null)

useEffect(() => {
    fetch(`/api/quotes/${id}`)
    .then(res => {
        if (!res.ok) throw new Error('Quote not found.')
        return res.json()
    })
    .then(setQuote)
    .catch(err => setError(err.message))
}, [id])

async function handleDelete() {
    const confirmed = window.confirm('Delete this quote? This cannot be undone.')
    if (!confirmed) return

    const res = await fetch(`/api/quotes/${id}`, { method: 'DELETE' })
    if (res.ok) {
    navigate('/')
    } else {
    alert('Failed to delete quote.')
    }
}

if (error) {
    return (
    <div>
        <p>{error}</p>
        <Link to="/">Back to list</Link>
    </div>
    )
}

if (!quote) return <div>Loading...</div>

const b = quote.breakdown

// Every dollar amount below needs the same 2-decimal formatting -
// one helper instead of repeating .toFixed(2) everywhere.
function money(amount) {
    return amount.toFixed(2)
}

// Spec Section 8 requires a plain-English explanation of how the quote
// was calculated, not just the raw numbers below. Built as one string
// here (rather than mixed into the JSX) so the sentence is easy to read
// top to bottom.
let explanation = `Hospital cover ($${money(b.hospital_total)}) and extras cover ($${money(b.extras_total)}) `
    + 'are calculated separately and added together'
if (quote.cover_type === 'Family') {
    explanation += ` along with the $${money(b.family_fee)} family upgrade fee`
}
explanation += `, giving a monthly premium of $${money(b.monthly_premium)}. `
explanation += `Multiplying by 12 gives a yearly premium of $${money(b.yearly_before_discount)} before any discount.`

if (quote.payment_frequency === 'Yearly') {
    explanation += ` Because this quote is paid yearly, a ${quote.annual_discount}% discount is applied, `
    + `bringing the final yearly total to $${money(b.yearly_after_discount)}.`
} else {
    explanation += ' Because this quote is paid monthly, no annual discount is applied.'
}

return (
    <div>
    <h1>{quote.customer_name}</h1>
    <p>{quote.cover_type} cover | {quote.payment_frequency} payment</p>

    <h2>Premium Breakdown</h2>
    <p>Hospital premium: ${money(b.hospital_total)}</p>
    <p>Extras premium: ${money(b.extras_total)}</p>
    {quote.cover_type === 'Family' && <p>Family upgrade fee: ${money(b.family_fee)}</p>}
    <p>Monthly premium: ${money(b.monthly_premium)}</p>
    <p>Yearly premium before discount: ${money(b.yearly_before_discount)}</p>
    {quote.payment_frequency === 'Yearly' && (
        <p>Yearly premium after discount: ${money(b.yearly_after_discount)}</p>
    )}

    <h2>LHC Loading</h2>
    {b.applicant_loadings.map(a => (
        <p key={a.applicant_number}>
        Applicant {a.applicant_number}: {a.loading_percent}% loading
        </p>
    ))}
    <p>{b.lhc_statement}</p>

    {b.warnings.length > 0 && (
        <div>
        <h2>Warnings</h2>
        {b.warnings.map((w, i) => <p key={i}>{w}</p>)}
        </div>
    )}

    <h2>How This Was Calculated</h2>
    <p>{explanation}</p>

    {quote.notes && (
        <>
        <h2>Notes</h2>
        <p>{quote.notes}</p>
        </>
    )}

    <br />
    <Link to="/">Back to list</Link>{' | '}
    <Link to={`/quotes/${id}/edit`}>Edit</Link>{' | '}
    <button onClick={handleDelete}>Delete</button>
    </div>
)
}

export default QuoteDetail
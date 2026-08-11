import { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router'

function QuoteDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [quote, setQuote] = useState(null)

  useEffect(() => {
    fetch(`/api/quotes/${id}`)
      .then(res => res.json())
      .then(setQuote)
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

  if (!quote) return <div>Loading...</div>

  const b = quote.breakdown

  return (
    <div>
      <h1>{quote.customer_name}</h1>
      <p>{quote.cover_type} cover — {quote.payment_frequency} payment</p>

      <h2>Premium Breakdown</h2>
      <p>Hospital premium: ${b.hospital_total.toFixed(2)}</p>
      <p>Extras premium: ${b.extras_total.toFixed(2)}</p>
      {quote.cover_type === 'Family' && <p>Family upgrade fee: ${b.family_fee.toFixed(2)}</p>}
      <p>Monthly premium: ${b.monthly_premium.toFixed(2)}</p>
      <p>Yearly premium before discount: ${b.yearly_before_discount.toFixed(2)}</p>
      {quote.payment_frequency === 'Yearly' && (
        <p>Yearly premium after discount: ${b.yearly_after_discount.toFixed(2)}</p>
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
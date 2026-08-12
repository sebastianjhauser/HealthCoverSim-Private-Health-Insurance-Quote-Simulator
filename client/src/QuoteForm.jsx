import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router'

function QuoteForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = Boolean(id)

  const [form, setForm] = useState({
    customer_name: '',
    cover_type: 'Single',
    applicant1_age: '',
    applicant1_cover_history: 'Yes',
    applicant2_age: '',
    applicant2_cover_history: 'Yes',
    hospital_cover: 'None',
    extras_cover: 'None',
    payment_frequency: 'Monthly',
    annual_discount: 0,
    notes: '',
  })

  // Holds validation/API error messages to show above the form.
  const [errors, setErrors] = useState([])

  // If we're editing, load the existing quote and fill the form with it.
  // Runs once when the page loads (or if the id in the URL changes).
  useEffect(() => {
    if (!isEditing) return

    fetch(`/api/quotes/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Could not load this quote.')
        return res.json()
      })
      .then(data => {
        setForm({
          customer_name: data.customer_name,
          cover_type: data.cover_type,
          applicant1_age: data.applicant1_age,
          applicant1_cover_history: data.applicant1_cover_history,
          applicant2_age: data.applicant2_age ?? '',
          applicant2_cover_history: data.applicant2_cover_history ?? 'Yes',
          hospital_cover: data.hospital_cover,
          extras_cover: data.extras_cover,
          payment_frequency: data.payment_frequency,
          annual_discount: data.annual_discount,
          notes: data.notes ?? '',
        })
      })
      .catch(err => setErrors([err.message]))
  }, [id, isEditing])

  // One handler for every input/select - it reads the field's "name"
  // attribute and updates just that key in the form state.
  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  // Mirrors the backend's validateQuote() in routes/quotes.js.
  // Runs before we submit, so the user gets instant feedback instead
  // of waiting on a round trip to the API just to be told "age invalid".
  function validate(body) {
    const errs = []

    if (!body.customer_name.trim()) {
      errs.push('Customer name is required.')
    }

    if (!Number.isFinite(body.applicant1_age) || body.applicant1_age < 18 || body.applicant1_age > 100) {
      errs.push('Applicant 1 age must be between 18 and 100.')
    }

    if (body.cover_type !== 'Single') {
      if (!Number.isFinite(body.applicant2_age) || body.applicant2_age < 18 || body.applicant2_age > 100) {
        errs.push('Applicant 2 age is required and must be between 18 and 100.')
      }
    }

    if (!Number.isFinite(body.annual_discount) || body.annual_discount < 0 || body.annual_discount > 10) {
      errs.push('Annual discount must be between 0 and 10.')
    }

    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()

    // Convert the text-input numbers from strings to actual numbers,
    // and clear Applicant 2 fields entirely when cover type is Single
    // (matches what the backend expects to store).
    const body = {
      ...form,
      applicant1_age: Number(form.applicant1_age),
      annual_discount: Number(form.annual_discount),
      applicant2_age: form.cover_type === 'Single' ? null : Number(form.applicant2_age),
      applicant2_cover_history: form.cover_type === 'Single' ? null : form.applicant2_cover_history,
    }

    const validationErrors = validate(body)
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }

    const res = await fetch(isEditing ? `/api/quotes/${id}` : '/api/quotes', {
      method: isEditing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      navigate(isEditing ? `/quotes/${id}` : '/')
    } else {
      const data = await res.json()
      setErrors(data.errors)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>{isEditing ? 'Edit Quote' : 'New Quote'}</h1>

      {errors.length > 0 && (
        <ul>
          {errors.map((err, i) => <li key={i}>{err}</li>)}
        </ul>
      )}

      <div><label>Customer name</label><br />
        <input name="customer_name" value={form.customer_name} onChange={handleChange} />
      </div>

      <div><label>Cover type</label><br />
        <select name="cover_type" value={form.cover_type} onChange={handleChange}>
          <option>Single</option>
          <option>Couple</option>
          <option>Family</option>
        </select>
      </div>

      <div><label>Applicant 1 age</label><br />
        <input type="number" name="applicant1_age" value={form.applicant1_age} onChange={handleChange} />
      </div>

      <div><label>Applicant 1 cover history</label><br />
        <select name="applicant1_cover_history" value={form.applicant1_cover_history} onChange={handleChange}>
          <option>Yes</option>
          <option>No</option>
          <option>Not sure</option>
        </select>
      </div>

      {/* Applicant 2 fields only show for Couple/Family - spec Section 11 */}
      {form.cover_type !== 'Single' && (
        <>
          <div><label>Applicant 2 age</label><br />
            <input type="number" name="applicant2_age" value={form.applicant2_age} onChange={handleChange} />
          </div>

          <div><label>Applicant 2 cover history</label><br />
            <select name="applicant2_cover_history" value={form.applicant2_cover_history} onChange={handleChange}>
              <option>Yes</option>
              <option>No</option>
              <option>Not sure</option>
            </select>
          </div>
        </>
      )}

      <div><label>Hospital cover</label><br />
        <select name="hospital_cover" value={form.hospital_cover} onChange={handleChange}>
          <option>None</option>
          <option>Basic</option>
          <option>Bronze</option>
          <option>Silver</option>
          <option>Gold</option>
        </select>
      </div>

      <div><label>Extras cover</label><br />
        <select name="extras_cover" value={form.extras_cover} onChange={handleChange}>
          <option>None</option>
          <option>Basic</option>
          <option>Standard</option>
          <option>Premium</option>
        </select>
      </div>

      <div><label>Payment frequency</label><br />
        <select name="payment_frequency" value={form.payment_frequency} onChange={handleChange}>
          <option>Monthly</option>
          <option>Yearly</option>
        </select>
      </div>

      {/* Discount only matters when paying Yearly - spec Section 5 */}
      {form.payment_frequency === 'Yearly' && (
        <div><label>Annual discount %</label><br />
          <input type="number" name="annual_discount" value={form.annual_discount} onChange={handleChange} />
        </div>
      )}

      <div><label>Notes</label><br />
        <textarea name="notes" value={form.notes} onChange={handleChange} />
      </div>

      <br />
      <button type="submit">{isEditing ? 'Save Changes' : 'Create Quote'}</button>
    </form>
  )
}

export default QuoteForm
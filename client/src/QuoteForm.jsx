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

  useEffect(() => {
    if (!isEditing) return
    fetch(`/api/quotes/${id}`)
      .then(res => res.json())
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
  }, [id, isEditing])

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()

    const body = {
      ...form,
      applicant1_age: Number(form.applicant1_age),
      annual_discount: Number(form.annual_discount),
      applicant2_age: form.cover_type === 'Single' ? null : Number(form.applicant2_age),
      applicant2_cover_history: form.cover_type === 'Single' ? null : form.applicant2_cover_history,
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
      alert(data.errors.join('\n'))
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>{isEditing ? 'Edit Quote' : 'New Quote'}</h1>

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
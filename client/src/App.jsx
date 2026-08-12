import {Routes, Route} from 'react-router'
import QuoteList from './QuoteList.jsx'
import QuoteForm from './QuoteForm.jsx'
import QuoteDetail from './QuoteDetail.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<QuoteList/>} />
      <Route path="/new" element={<QuoteForm/>} />
      <Route path="/quotes/:id" element={<QuoteDetail/>} />
      <Route path="/quotes/:id/edit" element={<QuoteForm/>} />
    </Routes>
  )
}

export default App
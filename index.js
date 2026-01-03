require('dotenv').config()
// 1. Tuodaan tarvittavat paketit
const express = require('express')
const morgan = require('morgan')
const cors = require('cors') 
const app = express()
const path = require('path')
const Person = require('./models/person')

// Otetaan käyttöön CORS
if (process.env.NODE_ENV !== 'production') {
  const cors = require('cors')
  app.use(cors())
}

// 👇 Tämä rivi on tärkein
app.use(express.static('dist'))
// Otetaan käyttöön JSON-muotoisen datan käsittely
app.use(express.json())
// Luo oma Morgan-token:
morgan.token('body', (req, res) => { 
  return JSON.stringify(req.body) 
})
// Käytetään Morgania:
// app.use(morgan('tiny')); // tavallinen
// app.use(morgan(':method :url :status :response-time ms :body', {
//   skip: (req) => req.method !== 'POST'
// }));

app.use(
  morgan(':method :url :status :res[content-length] - :response-time ms :body')
);


app.get('/api/people', (request, response, next) => {
  Person.find({})
    .then(people => {
      response.json(people)
    })
    .catch(error => next(error))
})
app.get('/api/people/:id', (request, response, next) => {
  const id = request.params.id
  Person.findById(id).then(person => {
    if (person) {
      response.json(person)
    } else {
      response.status(404).end()
    }
  })
  .catch(error => next(error))
})

app.get('/info', (request, response, next) => {
  const date = new Date()
  Person.countDocuments({})
    .then(count => {
      response.send(`<p>Phonebook has info for ${count} people</p><p>${date}</p>`)
    })
    .catch(error => next(error))
})

app.delete('/api/people/:id', (request, response, next) => {
  const id = request.params.id
  Person.findByIdAndDelete(id)
    .then(() => {
      response.status(204).end()
      console.log(`Person with id ${request.params.id} deleted`)
    })
    .catch(error => next(error))
})

// function getRandomInt(min, max) {
//   const minCeiled = Math.ceil(min);
//   const maxFloored = Math.floor(max);
//   return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled); 
//   // The maximum is exclusive and the minimum is inclusive
// }

app.post('/api/people', (request, response) => {
  const body = request.body

  if (!body.name) {
      return response.status(400).json({ error: 'name missing' })
  }
  if (!body.number) {
    return response.status(400).json({ error: 'number missing' })
  }  
  const person = new Person({
    name: body.name,                        // id: getRandomInt(100, 1000).toString(),
    number: body.number    
  })

  person.save().then(savedPerson => {
    response.json(savedPerson)
  })

})
app.put('/api/people/:id', (request, response, next) => {
  const { name, number } = request.body
  Person.findById(request.params.id)
      .then(person => {
        if (!person) {
          return response.status(404).end()
        }
        person.name = name       //päivitetään muistiinpanon tiedot
        person.number = number

        return person.save().then((updatedPerson) => {   //tallennetaan päivitetty muistiinpano tietokantaan
          response.json(updatedPerson)
        })
      })
      .catch(error => next(error))
})
// app.put('/api/people/:id', (request, response, next) => {
//   const id = request.params.id
//   const body = request.body 
//   const person = {
//     name: body.name,
//     number: body.number,
//   }
//   Person.findByIdAndUpdate(id, person, { new: true })
//     .then(updatedPerson => {
//       response.json(updatedPerson)
//     })
//     .catch(error => next(error))
// })

// 3️⃣ VIIMEISENÄ frontend fallback (regex!)
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'), err => {
    if (err) {
      res.status(500).send(err)
    }
  })
})
// Error handling middleware
const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}
// olemattomien osoitteiden käsittely
app.use(unknownEndpoint)

// Virheidenkäsittelymiddleware
app.use((error, request, response, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).json({ error: 'malformatted id' })
  }
  next(error)
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
import express from 'express'
import { config } from './config'
import { logger } from './utils/logger'
import cors from 'cors'
import { loadProofs, saveProofs } from '../db/helpers'

const app = express()
app.use(cors())
app.use(express.json())

app.get('/proof-params/:id', (req, res) => {
	const { id } = req.params
	res.json({
		data: {
			id,
			type: 'get_proof_params',
			attributes: {
				birth_date_lower_bound: '0x303030303030',
				birth_date_upper_bound: '0x303730333133',
				callback_url: `${config.API_URL}/callback/${id}`,
				citizenship_mask: '0x554B52',
				event_data:
					'0x2c53003793370f2bdb1f8e1fe5d1dca45ab435f8cce48da8371f42d9c96d60',
				event_id: '12345678900987654321',
				expiration_date_lower_bound: '0x303030303030',
				expiration_date_upper_bound: '0x303030303030',
				identity_counter: 0,
				identity_counter_lower_bound: 0,
				identity_counter_upper_bound: 0,
				selector: '32801',
				timestamp_lower_bound: '0',
				timestamp_upper_bound: '0',
			},
		},
		included: [],
	})
})

app.post('/callback/:id', (req, res) => {
	const { id } = req.params
	const proofs = loadProofs()

	const { data } = req.body
	console.log(data, data)

	if (!data || !data.attributes.proof) {
		return res.status(400).json({
			errors: [
				{
					title: 'Invalid Data',
					detail:
						'Proof data is required in the attributes of the data object.',
				},
			],
		})
	}

	if (proofs[id]) {
		return res.status(400).json({
			errors: [
				{
					title: 'Conflict',
					detail: 'Proof with this ID already exists.',
				},
			],
		})
	}

	proofs[id] = {
		id,
		date: new Date().getTime(),
		proof: data.attributes.proof,
	}

	saveProofs(proofs)

	res.status(201).json({})
})

app.get('/proof/:id', (req, res) => {
	const { id } = req.params
	const proofs = loadProofs()

	const proof = proofs[id]

	if (!proof) {
		return res.status(404).json({
			errors: [
				{
					title: 'Not Found',
					detail: `Proof with ID ${id} not found.`,
				},
			],
		})
	}

	res.json({
		data: {
			id,
			type: 'proof',
			attributes: {
				proof,
			},
		},
	})
})

async function bootstrap() {
	try {
		app.listen(config.PORT, () => {
			logger.info(`Server started at ${config.PORT}`)
		})
	} catch (error) {
		logger.error(`Server started at ${config.PORT}`)
		process.exit(1)
	}
}

bootstrap()

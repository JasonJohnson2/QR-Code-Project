// worker.js - Cloudflare Worker for Payment Processing

// ⚙️ MAINTENANCE MODE TOGGLE
// Set to true to show maintenance page, false to allow normal operation
const MAINTENANCE_MODE = true;

export default {
	async fetch(request, env) {
		// Check if maintenance mode is enabled
		if (MAINTENANCE_MODE) {
			return maintenancePage();
		}

		const url = new URL(request.url);

		// Handle POST requests to /api/pay
		if (url.pathname === "/api/pay" && request.method === "POST") {
			return handlePayment(request, env);
		}

		// Handle CORS preflight requests
		if (request.method === "OPTIONS") {
			return new Response(null, {
				headers: {
					"Access-Control-Allow-Origin": "*",
					"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
					"Access-Control-Allow-Headers": "Content-Type",
				},
			});
		}

		// For all other requests, serve static assets
		return env.ASSETS.fetch(request);
	},
};

// Maintenance page HTML
function maintenancePage() {
	return new Response(
		`
		<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8" />
			<meta name="viewport" content="width=device-width, initial-scale=1.0" />
			<title>Site Under Maintenance</title>
			<link
				href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
				rel="stylesheet"
			/>
			<style>
				* {
					margin: 0;
					padding: 0;
					box-sizing: border-box;
				}
				body {
					font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
					display: flex;
					justify-content: center;
					align-items: center;
					min-height: 100vh;
					background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
					color: white;
					padding: 20px;
				}
				.container {
					text-align: center;
					max-width: 600px;
					padding: 3rem 2rem;
					background: rgba(0, 0, 0, 0.3);
					border-radius: 20px;
					backdrop-filter: blur(10px);
					box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
				}
				.icon {
					font-size: 80px;
					margin-bottom: 1rem;
					animation: rotate 3s linear infinite;
				}
				@keyframes rotate {
					from { transform: rotate(0deg); }
					to { transform: rotate(360deg); }
				}
				h1 {
					font-size: 2.5rem;
					margin-bottom: 1rem;
					font-weight: 700;
				}
				p {
					font-size: 1.2rem;
					margin-bottom: 0.8rem;
					opacity: 0.9;
				}
				.time {
					font-size: 1rem;
					margin-top: 2rem;
					padding: 1rem;
					background: rgba(255, 255, 255, 0.1);
					border-radius: 10px;
					opacity: 0.8;
				}
			</style>
		</head>
		<body>
			<div class="container">
				<div class="icon">
					<i class="fas fa-tools"></i>
				</div>
				<h1>Under Maintenance</h1>
				<p>We're currently updating our payment system.</p>
				<p>We'll be back online shortly!</p>
				<div class="time">
					<i class="fas fa-clock"></i>
					Please check back soon
				</div>
			</div>
		</body>
		</html>
	`,
		{
			status: 503,
			headers: {
				"Content-Type": "text/html; charset=utf-8",
				"Retry-After": "3600", // Suggest retry after 1 hour
			},
		}
	);
}

async function handlePayment(request, env) {
	try {
		// Parse incoming JSON request
		const paymentData = await request.json();

		console.log("Processing payment:", paymentData);

		// Validate required fields
		if (!paymentData.paymentToken || !paymentData.amount) {
			return new Response(
				JSON.stringify({
					success: false,
					error: "Payment token and amount are required",
				}),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				}
			);
		}

		// Build NMI API request
		const nmiParams = new URLSearchParams({
			payment_token: paymentData.paymentToken,
			amount: paymentData.amount.toFixed(2),
			type: "sale",
			security_key: env.NMI_API_KEY, // Stored as environment variable
		});

		// Add optional customer information
		if (paymentData.first_name)
			nmiParams.append("first_name", paymentData.first_name);
		if (paymentData.last_name)
			nmiParams.append("last_name", paymentData.last_name);
		if (paymentData.email) nmiParams.append("email", paymentData.email);
		if (paymentData.phone) nmiParams.append("phone", paymentData.phone);
		if (paymentData.company) nmiParams.append("company", paymentData.company);

		// Add billing address
		if (paymentData.address1)
			nmiParams.append("address1", paymentData.address1);
		if (paymentData.address2)
			nmiParams.append("address2", paymentData.address2);
		if (paymentData.city) nmiParams.append("city", paymentData.city);
		if (paymentData.state) nmiParams.append("state", paymentData.state);
		if (paymentData.zip) nmiParams.append("zip", paymentData.zip);
		if (paymentData.country) nmiParams.append("country", paymentData.country);

		// Add 3DS fields if present
		if (paymentData.cardHolderAuth)
			nmiParams.append("cardholder_auth", paymentData.cardHolderAuth);
		if (paymentData.cavv) nmiParams.append("cavv", paymentData.cavv);
		if (paymentData.eci) nmiParams.append("eci", paymentData.eci);
		if (paymentData.directoryServerId)
			nmiParams.append("directory_server_id", paymentData.directoryServerId);
		if (paymentData.threeDsVersion)
			nmiParams.append("three_ds_version", paymentData.threeDsVersion);
		if (paymentData.xid) nmiParams.append("xid", paymentData.xid);

		console.log("Sending to NMI API...");

		// Call NMI API
		const nmiResponse = await fetch(
			"https://secure.networkmerchants.com/api/transact.php",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				body: nmiParams.toString(),
			}
		);

		const responseText = await nmiResponse.text();
		console.log("NMI Response:", responseText);

		// Parse NMI response (query string format)
		const responseParams = new URLSearchParams(responseText);
		const responseCode = responseParams.get("response");

		// Return success or error
		if (responseCode === "1") {
			return new Response(
				JSON.stringify({
					success: true,
					transactionId: responseParams.get("transactionid"),
				}),
				{
					headers: {
						"Content-Type": "application/json",
						"Access-Control-Allow-Origin": "*", // Allow CORS
					},
				}
			);
		} else {
			return new Response(
				JSON.stringify({
					success: false,
					error: responseParams.get("responsetext") || "Unknown error",
				}),
				{
					headers: {
						"Content-Type": "application/json",
						"Access-Control-Allow-Origin": "*",
					},
				}
			);
		}
	} catch (error) {
		console.error("Payment processing error:", error);
		return new Response(
			JSON.stringify({
				success: false,
				error: error.message,
			}),
			{
				status: 500,
				headers: {
					"Content-Type": "application/json",
					"Access-Control-Allow-Origin": "*",
				},
			}
		);
	}
}

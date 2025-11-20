// worker.js - Cloudflare Worker for Payment Processing
export default {
	async fetch(request, env) {
		const url = new URL(request.url);

		// Only handle POST requests to /api/pay
		if (url.pathname === "/api/pay" && request.method === "POST") {
			return handlePayment(request, env);
		}

		// For all other requests, return 404
		return new Response("Not Found", { status: 404 });
	},
};

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

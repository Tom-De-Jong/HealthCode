<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$apiKey = '';
$apiUrl = 'https://ai.hackclub.com/proxy/v1/chat/completions';

$input = json_decode(file_get_contents('php://input'), true);


$name = $input['ProductName'] ?? 'Unknown Product';
$ingred = $input['productIngredients'] ?? '';


if (empty($ingred)) {
    header('Content-Type: application/json');
    echo json_encode([
        "error" => "No ingredients received", 
        "debug_received_keys" => array_keys((array)$input)
    ]);
    exit;
}


$aiPrompt = "Product Name: " . $name . "\nIngredients: " . $ingred;

$systemPrompt = "You are a dietitian. Respond ONLY in JSON. Ensure all healthiness percentages are rounded to the nearest whole number (integers only). Format: {\"ingredients\": [{\"name\": \"string\", \"healthiness_percentage\": number}, ...], \"average_healthiness_percentage\": number, \"summary\": \"string\"}";

$data = [
    "model" => "openai/gpt-oss-120b",
    "messages" => [
        ["role" => "system", "content" => $systemPrompt],
        ["role" => "user", "content" => $aiPrompt] 
    ],
    "response_format" => ["type" => "json_object"]
];


$ch = curl_init($apiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: Bearer ' . $apiKey
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);


header('Content-Type: application/json');
if ($httpCode === 200) {
    echo $response;
} else {
    echo json_encode(["error" => "API request failed", "code" => $httpCode]);
}
?>
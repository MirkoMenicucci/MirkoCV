<?php

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'https://api.skebby.it/API/v1.0/REST/login');

curl_setopt($ch, CURLOPT_USERPWD, 'mirko.menicucci@gmail.com:#MirkoCV12345');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);


$response = curl_exec($ch);
$info = curl_getinfo($ch);
curl_close($ch);

if ($info['http_code'] != 200) {
    echo('Error! http code: ' . $info['http_code'] . ', body message: ' . $response);
}
else {
    $values = explode(";", $response);
    echo('user_key: ' . $values[0]);
    echo('Session_key: ' . $values[1]);
}
?>
<?php

$lat = $_POST['lat'];
$lng = $_POST['lng'];

echo file_get_contents("http://maps.googleapis.com/maps/api/geocode/json?latlng=$lat,$lng&sensor=false");


?>

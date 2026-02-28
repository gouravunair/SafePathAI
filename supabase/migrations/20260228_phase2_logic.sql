-- Updates map points and sets hazard scores based on altitude and slope
UPDATE roads SET geom = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326);
UPDATE roads SET hazard_weight = 5.0 WHERE altitude < 10;
UPDATE roads SET slope = ABS(altitude - (SELECT AVG(altitude) FROM roads)) / 100;
UPDATE roads SET hazard_weight = hazard_weight + 3.0 WHERE slope > 0.15;
-- Grant travel_user access to all objects created by postgres in V2/V3
GRANT ALL ON TABLE umrah_package_airlines TO travel_user;
GRANT USAGE, SELECT ON SEQUENCE umrah_package_airlines_id_seq TO travel_user;

-- Also cover any tables altered in V2 that travel_user may not have full access to
GRANT ALL ON TABLE airlines  TO travel_user;
GRANT ALL ON TABLE routes    TO travel_user;
GRANT ALL ON TABLE bookings  TO travel_user;

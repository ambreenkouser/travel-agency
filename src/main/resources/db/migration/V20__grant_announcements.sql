-- Grant travel_user access to the announcements table and its sequence
GRANT ALL ON TABLE announcements TO travel_user;
GRANT USAGE, SELECT ON SEQUENCE announcements_id_seq TO travel_user;

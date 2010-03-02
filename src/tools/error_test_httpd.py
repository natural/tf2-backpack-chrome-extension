#!/usr/bin/env python
import sys
import BaseHTTPServer


class TestServer(BaseHTTPServer.BaseHTTPRequestHandler):
    def do_GET(self):
	config = self.config
	self.send_response(config['response'])
	self.send_header('Content-type', config['type'])
	self.end_headers()
	self.wfile.write(config['doc'])


class Test_500(TestServer):
    config = dict(response=500,
		  doc='<html>500 - Application Error</html>',
 		  type='text/xml')


class Test_404(TestServer):
    config = dict(response=404,
		  doc='<html>404 - Not Found</html>',
		  type='text/html')


class Test_200badxml(TestServer):
    config = dict(response=200,
		  doc='<eggs>spam</eggs>',
 		  type='text/xml')


class Test_200badjson(TestServer):
    config = dict(response=200,
		  doc='{}',
 		  type='text/json')


if __name__ == '__main__':
    try:
	test_type = sys.argv[1]
    except (IndexError, ):
	print 'using test type 404'
	test_type = '404'
    try:
	cls = globals()['Test_' + test_type]
    except (KeyError, ):
	print 'uknown test type, using Test_404'
	cls = Test_404

    try:
	port = int(sys.argv[2])
    except (IndexError, ValueError, TypeError, ):
	port = 9090
	print 'uknown port, using %s' % (port, )

    try:
	hostname = sys.argv[3]
    except (IndexError, ):
	#hostname = 'www.tf2items.com'
	hostname = 'localhost'
	print 'using %s as host' % (hostname, )

    httpd = BaseHTTPServer.HTTPServer((hostname, port), cls)
    try:
	httpd.serve_forever()
    except (KeyboardInterrupt, ):
	pass
    httpd.server_close()


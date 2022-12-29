#!/bin/bash
echo 'Injecting assets version...';

lastmodbootstrapfacss=$(md5sum web/assets/css/bootstrap-fa.css | awk '{print $1}');
sed -i "s/bootstrapfacssv/$lastmodbootstrapfacss/g" src/ASS/Resources/view/bootstrap-fa.css.twig;

lastmoddefaultjs=$(md5sum web/assets/js/default.js | awk '{print $1}');
sed -i "s/defaultjsv/$lastmoddefaultjs/g" src/ASS/Resources/view/default.js.twig;

lastmodhomepagejs=$(md5sum web/assets/js/homepage.js | awk '{print $1}');
sed -i "s/homepagejsv/$lastmodhomepagejs/g" src/ASS/Resources/view/homepage.twig;

lastmodjquerybootstrapjsv=$(md5sum web/assets/js/jquery-bootstrap.js | awk '{print $1}');
sed -i "s/jquerybootstrapjsv/$lastmodjquerybootstrapjsv/g" src/ASS/Resources/view/jquery-bootstrap.js.twig;

lastmodproductDetailjsv=$(md5sum web/assets/js/productDetail.js | awk '{print $1}');
sed -i "s/productdetailjsv/$lastmodproductDetailjsv/g" src/ASS/Resources/view/productDetail.js.twig;

lastmodmarkerclustererjsv=$(md5sum web/assets/js/map/markerclusterer.js | awk '{print $1}');
sed -i "s/markerclustererjsv/$lastmodmarkerclustererjsv/g" src/ASS/Resources/view/js/markerclusterer.js.twig;

lastmodbasicjsv=$(md5sum web/assets/js/basic.js | awk '{print $1}');
sed -i "s/basicjsv/$lastmodbasicjsv/g" app/view/include/basic.js.twig;

lastmodcommoninpagejsv=$(md5sum web/assets/js/common-in-page.js | awk '{print $1}');
sed -i "s/commoninpagejsv/$lastmodcommoninpagejsv/g" src/ASS/Resources/view/common-in-page.js.twig;

lastmodwebviewjsv=$(md5sum web/assets/js/webview.js | awk '{print $1}');
sed -i "s/webviewjsv/$lastmodwebviewjsv/g" src/ASS/Resources/view/webview.js.twig;

lastmodgoogleanalyticsbottomjsv=$(md5sum web/assets/js/google-analytics-bottom.js | awk '{print $1}');
sed -i "s/googleanalyticsbottom/$lastmodgoogleanalyticsbottomjsv/g" src/ASS/Resources/view/google-analytics-bottom.js.twig;

lastmoduserconnectedjsv=$(md5sum web/assets/js/user.connected.js | awk '{print $1}');
sed -i "s/userconnectedjsv/$lastmoduserconnectedjsv/g" src/ASS/Resources/view/user.connected.js.twig;

lastmodglobalfunctionsjsv=$(md5sum web/assets/js/global-functions.js | awk '{print $1}');
sed -i "s/globalfunctionsjsv/$lastmodglobalfunctionsjsv/g" src/ASS/Resources/view/global-functions.js.twig;


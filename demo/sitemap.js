/** navbar
 *
 * @file sitemap.js
 * @author fe
 */
function genNavigator() {
    var navItems = '<li><a href="Head.html">Head</a></li>'
        + '<li><a href="Foot.html">Foot</a></li>'
        + '<li><a href="Data.html">Data</a></li>'
        + '<li><a href="Resize.html">Resize</a></li>'
        + '<li><a href="Select.html">Select</a></li>'
        + '<li><a href="FixedColumns.html">FixedColumns</a></li>'
        + '<li><a href="ColReorder.html">ColReorder</a></li>'
        + '<li><a href="Subrow.html">Subrow</a></li>'
        + '<li><a href="TreeGrid.html">TreeGrid</a></li>';

    var navigator = document.getElementById('navigator');
    navigator.innerHTML = navItems;
    var url = window.location.pathname;
    var filename = url.substring(url.lastIndexOf('/') + 1);
    var links = navigator.getElementsByTagName('a');
    for (var i = 0; i < links.length; i++) {
        if (links[i].getAttribute('href') === filename) {
            var parent = links[i].parentNode;
            parent.setAttribute('class', 'ui-nav-item-active');
        }
    }
}
genNavigator();

function footer() {
    var footHtml = '<p class="ui-text-center contrast">HI群：1401953</p>';
    var footerNode = document.createElement('div');
    footerNode.setAttribute('class', 'footer');
    footerNode.innerHTML = footHtml;
    document.getElementsByTagName('body')[0].appendChild(footerNode);
}
footer();

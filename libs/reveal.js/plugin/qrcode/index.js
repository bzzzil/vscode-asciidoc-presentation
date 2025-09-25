(function() {
    //FIXME better sizing
    var config = Reveal.getConfig();
    var size = Math.min(config.height,config.width) - 250;

    var containers = document.querySelectorAll("div.reveal-js-qrcode");
    containers.forEach(
        function(e){
            // Take only a height: width should be the same
            var height = e.getAttribute('height') != null ? e.getAttribute('height') : size;
            url = e.innerText;
            e.style.display = "flex";
            e.style.flexDirection = "column";
            e.style.alignItems = "center";
            new QRCode(e, {text:url, height:height, width: height});
            if(e.classList.contains("reveal-js-qrcode-display-link")){
                var p = document.createElement("p");
                var a = document.createElement("a");
                a.href = url;
                a.textContent = url;
                p.appendChild(a);
                e.appendChild(p);
            }
        });
}());

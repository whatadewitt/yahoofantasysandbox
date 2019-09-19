$(document).on("ready", function() {
  $("pre code").each(function(i, block) {
    hljs.highlightBlock(block);
  });

  function submitRequest() {
    if (!submitting) {
      submitting = true;
      $(".empty").removeClass("empty");

      var $items = $(".try input[type=text]");
      if ($(".try .nav").length > 0) {
        $items = $(".try .tab-pane.active input[type=text]");
      }

      $.each($items.not(".filter, .optional"), function(idx, val) {
        if (!$(val).val()) {
          $(val).addClass("empty");
        }
      });

      var data = {};
      $.each($items, function(idx, val) {
        var s = $(val)
          .val()
          .replace(" ", "");
        if (!_.isEmpty(s)) {
          if ($(val).hasClass("filter")) {
            if (!_.has(data, "filters")) {
              data.filters = {};
            }
            var id = $(val).attr("id");
            data.filters[id] = s;
          } else {
            data[$(val).attr("id")] = s;
          }
        }
      });

      if ($(".empty").length) {
        submitting = false;
        return;
      }

      $(".loading").toggle();

      if ($(".try .checkbox-group :checked").length > 0) {
        var subresources = [];
        $.each($(".try .checkbox-group :checked"), function(idx, val) {
          var sub = $(val).attr("name");
          subresources.push(sub);
        });
        data.subresources = subresources.join(",");
      }

      if (_.has(data, "filters")) {
        data.filters = JSON.stringify(data.filters);
      }

      // console.log(data);
      var error = false;
      $.get(
        "/data/" + resource + "/" + subresource,
        data,
        function(res) {
          $(".data-block h2").text("Output");
          $(".data-block .json").text(JSON.stringify(res, null, 2));
          console.log(JSON.stringify(res));
        },
        "json"
      )
        .fail(function(res) {
          $(".data-block h2").text("Output");
          $(".data-block .json").text(
            JSON.stringify(res.responseJSON, null, 2)
          );
        })
        .always(function() {
          $(".json").each(function(i, block) {
            hljs.highlightBlock(block);
          });
          $(window).scrollTo($(".data-block"), 800);
          submitting = false;
          $(".loading").toggle();
        });
    }
  }

  var submitting = false;
  $(".try .btn").on("click", submitRequest);
  $(".form-control").keypress(function(e) {
    if (13 === e.which) {
      submitRequest();
    }
  });
});

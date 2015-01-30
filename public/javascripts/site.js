$(document).on('ready', function() {
  $('pre code').each(function(i, block) {
    hljs.highlightBlock(block);
  });

  var submitting = false;
  $('.try .btn').on('click', function() {
    if (!submitting) {
      submitting = true;
      $('.empty').removeClass('empty');

      var $items = $('.try input[type=text]');
      if ( $('.try .nav').length > 0 ) {
        $items = $('.try .tab-pane.active input[type=text]');
      }

      $.each($items.not(".filter"), function(idx, val) {
        if ( !$(val).val() ) {
          $(val).addClass('empty');
        }
      });

      var data = {}
      $.each($items, function(idx, val) {
        var s = $(val).val().replace(' ', '');
        if ( !_.isEmpty(s) ) {
          if ( $(val).hasClass('filter') ) {
            if ( !_.has(data, 'filters') ) {
              data.filters = {};
            }
            var id = $(val).attr('id');
            data.filters[id] = s;
          } else {
            data[$(val).attr('id')] = s;
          }
        }
      });

      // if ( _.isEmpty(data) ) {
      //   if ( $('.try .at-least-one').length > 0 ) {
      //     // should only happen when filters are all empty and 1 is required (ie/ games collection)
      //     $items.addClass('empty');
      //   }
      // }

      if ( $('.empty').length ) {
        submitting = false;
        return;
      }

      $('.loading').toggle();

      if ( $('.try .checkbox-group :checked').length > 0 ) {
        var subresources = [];
        $.each($('.try .checkbox-group :checked'), function(idx, val) {
          var sub = $(val).attr('name');
          subresources.push(sub);
        });
        data.subresources = subresources.join(',');
      }

      if ( _.has(data, 'filters') ) {
        data.filters = JSON.stringify(data.filters);
      }

      console.log(data);
      $.get( '/data/' + resource + '/' + subresource,
        data,
        function(res) {
          // console.log(JSON.stringify(res));
          $('.data-block h2').text('Output');
          $('.data-block .json').text(JSON.stringify(res, null, 2));
          $('.json').each(function(i, block) {
            hljs.highlightBlock(block);
          });
          $(window).scrollTo( $('.data-block'), 800 );

          submitting = false;
          $('.loading').toggle();
        },
        'json'
        );
    }
  });
});

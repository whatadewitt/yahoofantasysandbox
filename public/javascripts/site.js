$(document).on('ready', function() {
  $('pre code').each(function(i, block) {
    hljs.highlightBlock(block);
  });

  var submitting = false;
  $('.try .btn').on('click', function() {
    if (!submitting) {
      submitting = true;
      $('.empty').removeClass('empty');

      $.each($('.try input[type=text]'), function(idx, val) {
        if ( !$(val).val() ) {
          $(val).addClass('empty');
        }
      });

      if ( $('.empty').length ) {
        submitting = false;
        return;
      }

      $('.loading').toggle();

      var data = {}
      $.each($('.try input[type=text]'), function(idx, val) {
        var s = $(val).val();
        data[$(val).attr('id')] = s.replace(' ', '');
      });

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
        )
    }
  });
});

import ejs from 'ejs';
import companyService from '../../search/company/company.service';

//todo: remove this module
export default {
  company: {
    async get(req, res, next) {
      try {
        const { company_id } = req.params;
        const company = await companyService.findActive(company_id);
        res.end(
          ejs.render(company_page, {
            url: 3456,
            title: company.name,
            description: 'Ghé thăm ' + company.name + ' tại SUM VIỆT',
            image: 'https://' + req.headers['x-forwarded-host'] + '/' + company.images[0],
            host: 'https://' + req.headers['x-forwarded-host']
          })
        );
      } catch (error) {
        next(error);
      }
    }
  }
};

const company_page = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="ie=edge" />
    <!--  <meta property="og:url" content="<%=url%>" /> -->
    <meta property="og:type" content="article" />
    <meta property="og:title" content="<%=title%>" />
    <meta property="og:description" content="<%=description%>" />
    <meta property="og:image" content="<%=image%>" />
    <meta property="fb:app_id" content="400596383836516" />
    <title>SUM VIỆT</title>
  </head>
  <body>
    <script>
      setTimeout(function(){
        window.location.href ="<%=host%>";
        }, 1000);
    </script>
    <p>Web page redirects after 1 seconds.</p>
</body>
</html>`;

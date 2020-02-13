export function index(app,modules){
 if(!~modules.indexOf('index'))
  return;

 app.set({data:'index.toggle',object:'Toggle'});
}
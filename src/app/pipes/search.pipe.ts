import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'search',
  standalone: false
})
export class SearchPipe implements PipeTransform {

  transform(value: any, query: string) {
    if (!query) {
      return value;
    }
    
    // value = value;

    let res = value.filter((item:any)=>{
       return JSON.stringify(item['name']).toLowerCase().includes(query.toLowerCase());
    });

    console.log(res);

    return res;
  }

}

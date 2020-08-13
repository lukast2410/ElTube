import { Component, OnInit } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from '../services/data.service';
import gql from 'graphql-tag';

@Component({
  selector: 'app-premium',
  templateUrl: './premium.component.html',
  styleUrls: ['./premium.component.scss']
})
export class PremiumComponent implements OnInit {
  GET_BILLING = gql `
    query GetMyBilling($user_id: Int!){
      getMyBilling(user_id: $user_id){
        id
        user_id
        day
        month
        year
        tipe
      }
    }
  `
  
  premium: boolean = false;
  user = null;
  loggedIn: boolean = false;
  users = [];

  billings = [];

  constructor(private apollo: Apollo, private route: ActivatedRoute, 
    private router: Router, public data: DataService) { }

  ngOnInit(): void {
    if(localStorage.getItem('users') == null){
      this.users = [];
    }
    else{
      this.getUserFromStorage();
      if(this.user.premium == "true"){
        this.premium = true;
        this.getMyBilling();
      }else{
        this.premium = false;
      }
    }
  }

  getUserFromStorage(){
    this.users = JSON.parse(localStorage.getItem('users'));
    this.user = this.users[0];
    this.loggedIn = true;
  }

  addToLocalStorage(user){
    this.users = [];
    this.users.push(user);
    localStorage.setItem('users', JSON.stringify(this.users));
  }

  removeUser(){
    window.localStorage.clear();
    this.loggedIn = false;
  }

  getExpiredPremiumDate(): string{
    let date = new Date(this.billings[0].year, this.billings[0].month-1, this.billings[0].day);
    if(this.billings[0].tipe == "anually"){
      date.setDate(date.getDate() + 365);
    }else if(this.billings[0].tipe == "monthly"){
      date.setDate(date.getDate() + 30);
    }
    let obj = {
      day: date.getDate(),
      month: date.getMonth() + 1,
      year: date.getFullYear()
    }
    return this.data.formatDate(obj);
  }

  getMyBilling(){
    this.apollo.watchQuery<any>({
      query: gql `
        query GetMyBilling($user_id: Int!){
          getMyBilling(user_id: $user_id){
            id
            user_id
            day
            month
            year
            tipe
          }
        }
      `,
      variables:{
        user_id: this.user.id,
      }
    }).valueChanges.subscribe(result => {
      this.billings = result.data.getMyBilling;
    })
  }

  createBilling(word: string){
    if(this.user == null){
      this.router.navigate['/home'];
    }
    this.apollo.mutate({
      mutation: gql `
        mutation CreateBilling($user_id: Int!, $day: Int!, $month: Int!, $year: Int!, $tipe: String!){
          createBilling(input: {
            user_id: $user_id,
            day: $day,
            month: $month,
            year: $year,
            tipe: $tipe
          }){
            id
            user_id
            day
            month
            year
            tipe
          }
        }
      `,
      variables:{
        user_id: this.user.id,
        day: new Date().getDate(),
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        tipe: word,
      },
      refetchQueries:[{
        query: this.GET_BILLING
        ,variables:{
          user_id: this.user.id
        }
      }]
    }).subscribe(result => {
      this.updateUser(this.user, "true");
    })
  }

  updateUser(user, premium){
    this.apollo.mutate({
      mutation: gql `
      mutation UpdateUser($name: String!, $email: String!, $photourl: String!, 
        $location: String!, $restricted: String!, $premium: String!){
          updateUser(email: $email, input: {
            name: $name, 
            email: $email, 
            photourl: $photourl, 
            location: $location, 
            restricted: $restricted, 
            premium: $premium
            }
          ){
            id
            name
            email
            photourl
            location
            restricted
            premium
          }
        }
      ` ,
      variables:{
        id: user.id,
        name: user.name,
        email: user.email,
        photourl: user.photourl,
        location: user.location,
        restricted: user.restricted,
        premium: premium
      }
    }).subscribe(result => {
      this.user = result.data;
      this.user = this.user.updateUser;
      this.removeUser();
      this.addToLocalStorage(this.user);
      location.reload();
    })
  }  
}

require 'json'
require 'rest-client'

class DashboardController < ApplicationController
    def index
    end

    def login
        #redirect to twitch login (redirect_to())
        puts "Session token: #{session[:token]}"
        if session[:token].nil?
            redirect_to "https://api.twitch.tv/kraken/oauth2/authorize?response_type=code&client_id=#{ENV['CLIENTID']}&redirect_uri=http://localhost:3000/callback"
            return
        else
            redirect_to "/dashboard"
            return
        end
    end

    def callback
        puts "Got to callback"
        @usercode = params[:code]
        api = TwitchAPI.new()
        response = api.authorize(@usercode)
        puts "Sessioning: #{response['access_token']}"
        session[:token] = response['access_token']
        session[:name] = api.getName(session[:token])
        user = User.find_by(username: session[:name])
        if user.nil?
            puts "User is nil, need to create user"
            newuser = User.new
            newuser.username = session[:name]
            newuser.pid = 0
            newuser.save
        end
        @userobject = newuser
        puts "Sessioned name: #{session[:name]}"
        redirect_to "/dashboard"
    end

    def home
    end

    def bot
        user = User.find_by(username: params[:username])
        if !user.nil?
            render plain: "#{user.pid}"
        else
            render plain: "-1"
        end
    end

    def start
        if session[:name] == params[:username]
            user = User.find_by(:username session[:name])
            bot = fork do
                exec "python bot.py #{session[:name]}"
            end
            user.pid = bot
            Process.detach(bot)
        end
    end

    def stop
        if session[:name] == params[:username]
            user = User.find_by(:username session[:name])
            if user.pid != 0 #TODO: Need to solve if bot doesn't die
                Process.kill("SIGTERM", user.pid)
                user.pid = 0
                render plain: "Success"
                return
            end
        end
    end
end

class TwitchAPI
    def initialize()
        @base = 'https://api.twitch.tv/kraken'
        @redirect = 'http://localhost:3000/callback'
        @clientid = ENV['CLIENTID']
        @clientsecret = ENV['CLIENTSECRET']
    end

    def getName(token)
        res = RestClient.get "#{@base}",{:client_id=>@clientid, :Authorization=>"OAuth #{token}", :Accept=>"application/vnd.twitchtv.v3+json"}#:client_id=>@clientid,
        puts "Name response: #{res}"
        json = JSON.parse(res)
        return json['token']['user_name']
    end

    def authorize(authcode)
        #data = {'client_id'=>@clientid, 'client_secret'=>@clientsecret, 'grant_type'=>'authorization_code','redirect_uri'=>@redirect, 'code'=>authcode}.to_json
        body = begin
            RestClient.post "#{@base}/oauth2/token",{:client_id=>@clientid, :client_secret=>@clientsecret, :grant_type=>'authorization_code',:redirect_uri=>@redirect, :code=>authcode}, {:Accept=>'application/vnd.twitchtv.v3+json'}
            #RestClient.post "#{@base}/oauth2/token?client_id=#{@clientid}&client_secret=#{@clientsecret}&grant_type=authorization_code&redirect_uri=#{@redirect}&code=#{authcode}"#&state=[your provided unique token]
        rescue => e
            puts e.response.body
        end
        puts "Token response: #{body}"
        res = JSON.parse(body)
        return res
    end
end

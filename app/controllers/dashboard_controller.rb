require 'json'
require 'rest-client'

class DashboardController < ApplicationController

    def index
    end

    def login
        #@redirect = 'http://zojibot.herokuapp.com/callback'
        @redirect = "http://localhost:3000/callback"
        puts "Session token: #{session[:token]}"
        if session[:token].nil?
            redirect_to "https://api.twitch.tv/kraken/oauth2/authorize?response_type=code&client_id=#{ENV['TCLIENTID']}&redirect_uri=#{@redirect}"
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
        puts "CODE FROM TWITCH: #{@usercode}"
        response = api.authorize(@usercode)
        puts "Sessioning: #{response['access_token']}"
        session[:token] = response['access_token']
        session[:name] = api.getName(session[:token])
        begin
            user = User.find_by(username: session[:name])

        rescue => e
            puts "DATABASE ERROR IN CALLBACK: #{e}"
        end
        if user.nil?
            puts "User is nil, need to create user"
            newuser = User.new
            newuser.username = session[:name]
            newuser.pid = 0
            session[:usertoken] = ('a'..'z').to_a.shuffle[0,8].join
            newuser.token = session[:usertoken]
            newuser.save
        else
            session[:usertoken] = ('a'..'z').to_a.shuffle[0,8].join
            user.token = session[:usertoken]
            user.save
            puts "user token is: #{session[:usertoken]}"
        end
        puts "Sessioned name: #{session[:name]}"
        redirect_to "/dashboard"
    end

    def home
        if session[:name].nil?
            redirect_to "/"
        end
    end

    def bot
        user = User.find_by(username: params[:user])
        if !user.nil? && user.token == params[:token]
            puts "User found"
            render plain: "#{user.pid}"
        else
            puts "No user found"
            render plain: "-1"
        end
    end

    def start
        if !params[:user].nil?
            user = User.find_by(username: params[:user])
            if user.token == params[:token]
                btoken = ('a'..'z').to_a.shuffle[0,8].join
                bot = fork do
                    exec "python bot.py #{params[:user]} #{btoken}"
                end
                puts "Bot pid: #{bot}"
                user.pid = bot
                user.bottoken = btoken
                user.save
                Process.detach(bot)
                render plain: "Success"
                return
            end
        end
        render plain: "Error"
    end

    def stop
        if !params[:user].nil?
            user = User.find_by(username: params[:user])
            if user.pid != 0 && user.token == params[:token]#TODO: Need to solve if bot doesn't die
                begin
                    Process.kill("SIGTERM", user.pid)
                rescue
                    user.pid = 0
                    user.save
                    render plain: "Success"
                    return
                end
                user.pid = 0
                user.save
                render plain: "Success"
                return
            end
            render plain: "Error"
        end
    end

    def commands#should be given either all or a number representing the nth batch of 10
        if !params[:user].nil?
            user = User.find_by(username: params[:user])
            puts "Username checked, user found: #{user.username}"
            puts "User's token: #{user.token}; User's bot token: #{user.bottoken}"
            if user.token == params[:token] || user.bottoken == params[:bottoken]
                puts "Token checked"
                if params[:batch] == "all"
                    commands = Command.where(username: params[:user])

                else#batch num
                    batchStart = (params[:batch].to_i*10)-10
                    commands = Command.where(username: params[:user]).slice(batchStart, batchStart+10)
                end
                if commands.nil?
                    puts "No commands found"
                end
                res = "{ \"commands\":["
                count = 0
                commands.each do |c|
                    count += 1
                    res = "#{res} #{c.as_json.to_json},"
                end
                if count > 0
                    render plain: "#{res[0..-2]}]}"
                else
                    render plain: "#{res}]}"
                end
                return
            end
        end
        render plain: "Error getting commands"
    end

    def add#user, call, response, token, userlevel
        user = User.find_by(username: params[:user])
        if !user.nil?
            duplicate = Command.find_by(username: params[:user], call: params[:call])
            if duplicate.nil? && user.token == params[:token]
                newcommand = Command.new
                newcommand.call = params[:call]
                newcommand.response = params[:response]
                newcommand.username = params[:user]
                newcommand.userlevel = params[:userlevel]
                newcommand.save
                render plain: "Success"#TODO: if bot is running, restart it
                return
            else
                render plain: "Duplicate"
                return
            end
        end
        render plain: "No user"
    end

    def edit
        user = User.find_by(username: params[:user])
        if !user.nil? && user.token == params[:token]
            command = Command.find_by(username: params[:user], call: params[:call])
            if !command.nil?
                command.response = params[:response]
                command.userlevel = params[:userlevel]
                command.save
                render plain: "Success"
                return
            end
        end
        render plain: "Error"
    end
end

class TwitchAPI
    def initialize()
        @base = 'https://api.twitch.tv/kraken'
        #@redirect = 'http://zojibot.herokuapp.com/callback'
        @redirect = 'http://localhost:3000/callback'
        @clientid = ENV['TCLIENTID']
        @clientsecret = ENV['TCLIENTSECRET']
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
            puts "Error getting token: #{e.response.body}"
        end
        puts "Token response: #{body}"
        res = JSON.parse(body)
        return res
    end
end
